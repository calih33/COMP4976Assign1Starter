using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using RazorProfiles.Data;
using RazorProfiles.Models;

namespace RazorProfiles.Pages;

public class IndexModel : PageModel
{
    private readonly ApplicationDbContext _context;

    public IndexModel(ApplicationDbContext context)
    {
        _context = context;
    }

    public IList<Profile> MyProfiles { get; set; } = default!;

    public async Task OnGetAsync()
    {
        MyProfiles = await _context.Profiles!.OrderBy(p => p.Name).ToListAsync();
    }
}
