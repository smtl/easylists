using System.ComponentModel;
using Dapper;
using ModelContextProtocol.Server;
using Npgsql;

// MCP tools for one notepad, scoped by the {notepadId} route segment the
// connector URL embeds (see Program.cs's MapGroup("/mcp/{notepadId}")).
// Tool descriptions are the only "prompting" surface here — the actual
// judgment of which list something belongs in is entirely Claude's, not
// anything this server classifies.
[McpServerToolType]
public class NotepadTools
{
    private readonly NpgsqlDataSource _db;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public NotepadTools(NpgsqlDataSource db, IHttpContextAccessor httpContextAccessor)
    {
        _db = db;
        _httpContextAccessor = httpContextAccessor;
    }

    private string NotepadId =>
        _httpContextAccessor.HttpContext?.GetRouteValue("notepadId") as string
        ?? throw new InvalidOperationException("notepadId route value missing");

    [McpServerTool(Name = "list_lists")]
    [Description(
        "Lists every list in this notepad, each with its id, name, and current items " +
        "(text + done). Call this before add_items so you know what lists already exist " +
        "and can reuse one instead of creating a near-duplicate.")]
    public async Task<object> ListLists()
    {
        await using var conn = await _db.OpenConnectionAsync();
        var notepadId = NotepadId;

        var lists = (await conn.QueryAsync(
            @"SELECT id, name FROM lists WHERE notepad_id = @notepadId AND deleted_at IS NULL ORDER BY order_index",
            new { notepadId })).ToList();

        var listIds = lists.Select(l => (string)l.id).ToList();
        var todosByList = (await conn.QueryAsync(
            @"SELECT id, list_id AS ""ListId"", text, done FROM todos
              WHERE list_id = ANY(@listIds) AND deleted_at IS NULL ORDER BY order_index",
            new { listIds }))
            .GroupBy(t => (string)t.ListId)
            .ToDictionary(g => g.Key, g => g.ToList());

        return lists.Select(l => new
        {
            id = (string)l.id,
            name = (string)l.name,
            items = (todosByList.TryGetValue((string)l.id, out List<dynamic>? rows) ? rows! : new List<dynamic>())
                .Select(t => new { text = (string)t.text, done = (bool)t.done }),
        });
    }

    [McpServerTool(Name = "add_items")]
    [Description(
        "Adds todo items to a list in this notepad, identified by name (case-insensitive). " +
        "If a list with that exact name doesn't exist yet, it's created first — so to follow " +
        "an explicit instruction, pass the named list; to create a new list (e.g. a 'Long Term' " +
        "list for a non-actionable note), just pass a name that doesn't already exist. " +
        "Prefer reusing a list from list_lists over creating a near-duplicate with a slightly " +
        "different name.")]
    public async Task<object> AddItems(
        [Description("Exact name of the target list, e.g. \"Shopping\" or \"Long Term\"")] string listName,
        [Description("The todo item texts to add, one per item")] string[] items)
    {
        await using var conn = await _db.OpenConnectionAsync();
        var notepadId = NotepadId;

        var existing = await conn.QuerySingleOrDefaultAsync(
            @"SELECT id, name FROM lists
              WHERE notepad_id = @notepadId AND deleted_at IS NULL AND lower(name) = lower(@listName)",
            new { notepadId, listName });

        string listId;
        bool created;
        if (existing is not null)
        {
            listId = existing.id;
            created = false;
        }
        else
        {
            var nextListIndex = await conn.QuerySingleAsync<double>(
                "SELECT COALESCE(MAX(order_index), -1) + 1 FROM lists WHERE notepad_id = @notepadId AND deleted_at IS NULL",
                new { notepadId });
            listId = IdGenerator.NewId();
            await conn.ExecuteAsync(
                "INSERT INTO lists (id, notepad_id, name, order_index) VALUES (@listId, @notepadId, @listName, @nextListIndex)",
                new { listId, notepadId, listName, nextListIndex });
            created = true;
        }

        var nextTodoIndex = await conn.QuerySingleAsync<double>(
            "SELECT COALESCE(MAX(order_index), -1) + 1 FROM todos WHERE list_id = @listId AND deleted_at IS NULL",
            new { listId });

        foreach (var text in items)
        {
            await conn.ExecuteAsync(
                "INSERT INTO todos (id, list_id, text, order_index) VALUES (@id, @listId, @text, @nextTodoIndex)",
                new { id = IdGenerator.NewId(), listId, text, nextTodoIndex });
            nextTodoIndex += 1;
        }

        return new { listId, listName, createdList = created, addedCount = items.Length };
    }
}
