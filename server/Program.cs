using System.Security.Cryptography;
using System.Threading.RateLimiting;
using Dapper;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? "postgresql://ste@localhost:5432/easylists_dev";
var connectionString = BuildConnectionString(databaseUrl);
var dataSource = NpgsqlDataSource.Create(connectionString);
builder.Services.AddSingleton(dataSource);

var allowedOrigins = (Environment.GetEnvironmentVariable("ALLOWED_ORIGIN") ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
        }
    });
});

builder.Services.AddHttpContextAccessor();
builder.Services
    .AddMcpServer()
    .WithHttpTransport()
    .WithTools<NotepadTools>();

// Entropy alone (128-bit ids) already makes guessing infeasible, but this
// bounds how fast any one client can even try — generous enough that real
// usage (polling, a burst of MCP calls) never comes close to it.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 4,
                QueueLimit = 0,
            }));
});

var app = builder.Build();

// The app only ever receives traffic through Railway's own edge proxy, so
// the forwarded client IP can be trusted — without this, every request
// would appear to come from the proxy's address and share one rate-limit
// bucket.
var forwardedHeadersOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
};
// Defaults only trust loopback; clear so Railway's proxy address is accepted.
forwardedHeadersOptions.KnownIPNetworks.Clear();
forwardedHeadersOptions.KnownProxies.Clear();
app.UseForwardedHeaders(forwardedHeadersOptions);

app.UseRateLimiter();
app.UseCors();

// Scoped by the {notepadId} path segment the connector URL embeds — see NotepadTools.cs.
app.MapGroup("/mcp/{notepadId}").MapMcp();

// Schema is applied idempotently on every boot — no migration framework needed at this scale.
await using (var initConn = await dataSource.OpenConnectionAsync())
{
    var schemaSql = await File.ReadAllTextAsync(Path.Combine(AppContext.BaseDirectory, "schema.sql"));
    await initConn.ExecuteAsync(schemaSql);
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapPost("/api/notepads", async (NpgsqlDataSource db) =>
{
    var id = IdGenerator.NewId();
    await using var conn = await db.OpenConnectionAsync();
    var createdAt = await conn.QuerySingleAsync<DateTime>(
        "INSERT INTO notepads (id) VALUES (@id) RETURNING created_at", new { id });
    return Results.Ok(new { id, createdAt });
});

app.MapGet("/api/notepads/{notepadId}", async (string notepadId, NpgsqlDataSource db) =>
{
    await using var conn = await db.OpenConnectionAsync();
    var notepad = await conn.QuerySingleOrDefaultAsync(
        "SELECT id, created_at FROM notepads WHERE id = @notepadId", new { notepadId });
    if (notepad is null) return Results.NotFound();

    var response = await LoadNotepadAsync(conn, notepadId);
    return Results.Ok(response);
});

app.MapPost("/api/notepads/{notepadId}/import", async (string notepadId, ImportRequest body, NpgsqlDataSource db) =>
{
    await using var conn = await db.OpenConnectionAsync();
    var exists = await conn.QuerySingleOrDefaultAsync<string>(
        "SELECT id FROM notepads WHERE id = @notepadId", new { notepadId });
    if (exists is null) return Results.NotFound();

    await using var tx = await conn.BeginTransactionAsync();

    var listIndex = 0;
    foreach (var list in body.Lists)
    {
        var listId = IdGenerator.NewId();
        await conn.ExecuteAsync(
            "INSERT INTO lists (id, notepad_id, name, order_index) VALUES (@listId, @notepadId, @name, @orderIndex)",
            new { listId, notepadId, name = list.Name, orderIndex = (double)listIndex }, tx);

        var todoIndex = 0;
        foreach (var todo in list.Todos)
        {
            var todoId = IdGenerator.NewId();
            await conn.ExecuteAsync(
                @"INSERT INTO todos (id, list_id, text, done, order_index, created_at, completed_at)
                  VALUES (@todoId, @listId, @text, @done, @orderIndex, @createdAt, @completedAt)",
                new
                {
                    todoId,
                    listId,
                    text = todo.Text,
                    done = todo.Done,
                    orderIndex = (double)todoIndex,
                    createdAt = todo.CreatedDate ?? DateTime.UtcNow,
                    completedAt = todo.CompletedDate,
                }, tx);
            todoIndex++;
        }
        listIndex++;
    }

    await tx.CommitAsync();

    var response = await LoadNotepadAsync(conn, notepadId);
    return Results.Ok(response);
});

app.MapPost("/api/notepads/{notepadId}/lists", async (string notepadId, CreateListRequest body, NpgsqlDataSource db) =>
{
    await using var conn = await db.OpenConnectionAsync();
    var exists = await conn.QuerySingleOrDefaultAsync<string>(
        "SELECT id FROM notepads WHERE id = @notepadId", new { notepadId });
    if (exists is null) return Results.NotFound();

    var nextIndex = await conn.QuerySingleAsync<double>(
        "SELECT COALESCE(MAX(order_index), -1) + 1 FROM lists WHERE notepad_id = @notepadId", new { notepadId });

    var listId = IdGenerator.NewId();
    var row = await conn.QuerySingleAsync(
        @"INSERT INTO lists (id, notepad_id, name, order_index)
          VALUES (@listId, @notepadId, @name, @nextIndex)
          RETURNING id, name, order_index AS ""OrderIndex""",
        new { listId, notepadId, name = body.Name, nextIndex });

    return Results.Ok(new ListResponse(row.id, row.name, row.OrderIndex, new List<TodoResponse>()));
});

app.MapPatch("/api/lists/{listId}", async (string listId, UpdateListRequest body, NpgsqlDataSource db) =>
{
    await using var conn = await db.OpenConnectionAsync();
    var row = await conn.QuerySingleOrDefaultAsync(
        @"UPDATE lists SET name = COALESCE(@name, name) WHERE id = @listId
          RETURNING id, name, order_index AS ""OrderIndex""",
        new { listId, name = body.Name });
    if (row is null) return Results.NotFound();
    return Results.Ok(new { row.id, row.name, row.OrderIndex });
});

app.MapDelete("/api/lists/{listId}", async (string listId, NpgsqlDataSource db) =>
{
    await using var conn = await db.OpenConnectionAsync();
    var deleted = await conn.ExecuteAsync("DELETE FROM lists WHERE id = @listId", new { listId });
    return deleted == 0 ? Results.NotFound() : Results.NoContent();
});

app.MapPost("/api/lists/{listId}/todos", async (string listId, CreateTodoRequest body, NpgsqlDataSource db) =>
{
    await using var conn = await db.OpenConnectionAsync();
    var listExists = await conn.QuerySingleOrDefaultAsync<string>(
        "SELECT id FROM lists WHERE id = @listId", new { listId });
    if (listExists is null) return Results.NotFound();

    var nextIndex = await conn.QuerySingleAsync<double>(
        "SELECT COALESCE(MAX(order_index), -1) + 1 FROM todos WHERE list_id = @listId", new { listId });

    var todoId = IdGenerator.NewId();
    var row = await conn.QuerySingleAsync(
        @"INSERT INTO todos (id, list_id, text, order_index)
          VALUES (@todoId, @listId, @text, @nextIndex)
          RETURNING id, text, done, order_index AS ""OrderIndex"", created_at AS ""CreatedAt"", completed_at AS ""CompletedAt""",
        new { todoId, listId, text = body.Text, nextIndex });

    return Results.Ok(new TodoResponse(row.id, row.text, row.done, row.OrderIndex, row.CreatedAt, row.CompletedAt));
});

app.MapPatch("/api/todos/{todoId}", async (string todoId, UpdateTodoRequest body, NpgsqlDataSource db) =>
{
    await using var conn = await db.OpenConnectionAsync();

    // completed_at tracks `done` in-place — this is what replaces the old
    // client-side delete+recreate-on-toggle behaviour with a real update.
    var row = await conn.QuerySingleOrDefaultAsync(
        @"UPDATE todos SET
            text = COALESCE(@text, text),
            done = COALESCE(@done, done),
            completed_at = CASE
              WHEN @done IS NULL THEN completed_at
              WHEN @done = true AND done = false THEN now()
              WHEN @done = false THEN NULL
              ELSE completed_at
            END
          WHERE id = @todoId
          RETURNING id, text, done, order_index AS ""OrderIndex"", created_at AS ""CreatedAt"", completed_at AS ""CompletedAt""",
        new { todoId, text = body.Text, done = body.Done });

    if (row is null) return Results.NotFound();
    return Results.Ok(new TodoResponse(row.id, row.text, row.done, row.OrderIndex, row.CreatedAt, row.CompletedAt));
});

app.MapDelete("/api/todos/{todoId}", async (string todoId, NpgsqlDataSource db) =>
{
    await using var conn = await db.OpenConnectionAsync();
    var deleted = await conn.ExecuteAsync("DELETE FROM todos WHERE id = @todoId", new { todoId });
    return deleted == 0 ? Results.NotFound() : Results.NoContent();
});

app.Run();

static async Task<NotepadResponse> LoadNotepadAsync(NpgsqlConnection conn, string notepadId)
{
    var notepad = await conn.QuerySingleAsync(
        "SELECT id, created_at AS \"CreatedAt\" FROM notepads WHERE id = @notepadId", new { notepadId });

    var lists = (await conn.QueryAsync(
        @"SELECT id, name, order_index AS ""OrderIndex"" FROM lists
          WHERE notepad_id = @notepadId ORDER BY order_index",
        new { notepadId })).ToList();

    var listIds = lists.Select(l => (string)l.id).ToList();
    var todosByList = (await conn.QueryAsync(
        @"SELECT id, list_id AS ""ListId"", text, done, order_index AS ""OrderIndex"",
                 created_at AS ""CreatedAt"", completed_at AS ""CompletedAt""
          FROM todos WHERE list_id = ANY(@listIds) ORDER BY order_index",
        new { listIds }))
        .GroupBy(t => (string)t.ListId)
        .ToDictionary(g => g.Key, g => g.ToList());

    var listResponses = lists.Select(l =>
    {
        var todos = todosByList.TryGetValue((string)l.id, out List<dynamic>? rows) ? rows! : new List<dynamic>();
        var todoResponses = todos
            .Select(t => new TodoResponse(t.id, t.text, t.done, t.OrderIndex, t.CreatedAt, t.CompletedAt))
            .ToList();
        return new ListResponse(l.id, l.name, l.OrderIndex, todoResponses);
    }).ToList();

    return new NotepadResponse(notepad.id, notepad.CreatedAt, listResponses);
}

static string BuildConnectionString(string databaseUrl)
{
    var uri = new Uri(databaseUrl);
    var userInfoParts = uri.UserInfo.Split(':', 2);
    var csBuilder = new NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port > 0 ? uri.Port : 5432,
        Database = uri.AbsolutePath.TrimStart('/'),
        SslMode = SslMode.Prefer,
    };
    if (userInfoParts.Length > 0 && userInfoParts[0].Length > 0)
    {
        csBuilder.Username = Uri.UnescapeDataString(userInfoParts[0]);
    }
    if (userInfoParts.Length > 1)
    {
        csBuilder.Password = Uri.UnescapeDataString(userInfoParts[1]);
    }
    return csBuilder.ConnectionString;
}

static class IdGenerator
{
    // 0/O and 1/l/I removed to avoid visually-ambiguous ids.
    private const string Alphabet = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";

    // 22 chars over this 57-char alphabet is ~128 bits of entropy — on par
    // with a UUIDv4 — since this id is the only access credential a notepad
    // has. Safe to bump now while no real data exists; old 12-char ids
    // already issued stay valid (length isn't otherwise significant).
    public static string NewId(int length = 22)
    {
        var chars = new char[length];
        for (var i = 0; i < length; i++)
        {
            chars[i] = Alphabet[RandomNumberGenerator.GetInt32(Alphabet.Length)];
        }
        return new string(chars);
    }
}

record NotepadResponse(string Id, DateTime CreatedAt, List<ListResponse> Lists);
record ListResponse(string Id, string Name, double OrderIndex, List<TodoResponse> Todos);
record TodoResponse(string Id, string Text, bool Done, double OrderIndex, DateTime CreatedAt, DateTime? CompletedAt);

record CreateListRequest(string Name);
record UpdateListRequest(string? Name);
record CreateTodoRequest(string Text);
record UpdateTodoRequest(string? Text, bool? Done);

record ImportTodo(string Text, bool Done, DateTime? CreatedDate, DateTime? CompletedDate);
record ImportList(string Name, List<ImportTodo> Todos);
record ImportRequest(List<ImportList> Lists);
