using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using RazorProfiles.Data;
using RazorProfiles.Models;

namespace RazorProfiles.Pages.ProfilePages;

public class DetailsModel : PageModel
{
    private readonly ApplicationDbContext _context;

    public DetailsModel(ApplicationDbContext context)
    {
        _context = context;
    }

    public Profile Profile { get; set; } = default!;

    public async Task<IActionResult> OnGetAsync(int? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var profile = await _context.Profiles!
            .Include(p => p.Posts)
            .FirstOrDefaultAsync(p => p.ProfileId == id);

        if (profile == null)
        {
            return NotFound();
        }

        Profile = profile;
        return Page();
    }
}
