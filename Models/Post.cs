using System.ComponentModel.DataAnnotations.Schema;

namespace RazorProfiles.Models;

public class Post
{
    public int PostId { get; set; }

    public string? Text { get; set; }

    public DateTime PostedOn { get; set; }

    public int ProfileId { get; set; }

    [ForeignKey("ProfileId")]
    public Profile? Profile { get; set; }
}
