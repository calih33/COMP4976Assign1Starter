using System.ComponentModel.DataAnnotations;

namespace RazorProfiles.Models;

public class Profile
{
    public int ProfileId { get; set; }

    public string? Name { get; set; }

    [Display(Name = "Username")]
    public string? Handle { get; set; }

    public string? Location { get; set; }

    public string? Bio { get; set; }

    // Comma-separated, e.g. "hiking, film photography, rainy days"
    public string? Interests { get; set; }

    public List<Post>? Posts { get; set; }
}
