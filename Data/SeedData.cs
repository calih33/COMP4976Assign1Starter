using Microsoft.EntityFrameworkCore;
using RazorProfiles.Models;

namespace RazorProfiles.Data;

public static class SeedData
{
    // this is an extension method to the ModelBuilder class
    public static void Seed(this ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Profile>().HasData(GetProfiles());
        modelBuilder.Entity<Post>().HasData(GetPosts());
    }

    // Made-up people for the demo.
    public static List<Profile> GetProfiles()
    {
        return new List<Profile>()
        {
            new Profile
            {
                ProfileId = 1, Name = "Maya Lindqvist", Handle = "mayahikes", Location = "Squamish, BC",
                Bio = "Weekend hiker and film photographer. I live for misty mornings, mossy trails and the smell of rain on pine trees.",
                Interests = "hiking, film photography, rainy days, camping"
            },
            new Profile
            {
                ProfileId = 2, Name = "Jordan Okafor", Handle = "nightowl.jo", Location = "Toronto, ON",
                Bio = "Night owl, indie game dev and synthwave fan. Most of my best ideas happen at 2am under neon lights.",
                Interests = "game dev, synthwave, pixel art, late nights"
            },
            new Profile
            {
                ProfileId = 3, Name = "Priya Nair", Handle = "priyabakes", Location = "Vancouver, BC",
                Bio = "Home baker who never says no to cinnamon. Cozy sweaters, warm kitchens and Sunday morning pastries.",
                Interests = "baking, cafes, knitting, autumn"
            },
            new Profile
            {
                ProfileId = 4, Name = "Leo Martins", Handle = "leo.ocean", Location = "Halifax, NS",
                Bio = "Marine biology student. Happiest by the sea, counting seals and chasing sunsets on the harbour.",
                Interests = "marine life, surfing, sunsets, the ocean"
            },
        };
    }

    public static List<Post> GetPosts()
    {
        return new List<Post>()
        {
            new Post { PostId = 1,  ProfileId = 1, PostedOn = new DateTime(2026, 10, 12), Text = "Fog rolled in at the lookout this morning. Shot a whole roll in twenty minutes." },
            new Post { PostId = 2,  ProfileId = 1, PostedOn = new DateTime(2026, 10, 5),  Text = "Trail tip: the creek loop is beautiful after rain, just bring good boots." },
            new Post { PostId = 3,  ProfileId = 1, PostedOn = new DateTime(2026, 9, 28),  Text = "Finally developed my summer photos. The lake ones came out perfect." },
            new Post { PostId = 4,  ProfileId = 2, PostedOn = new DateTime(2026, 10, 13), Text = "Shipped a new level for my game at 3am. Worth it." },
            new Post { PostId = 5,  ProfileId = 2, PostedOn = new DateTime(2026, 10, 7),  Text = "New synthwave playlist for coding sessions is up." },
            new Post { PostId = 6,  ProfileId = 2, PostedOn = new DateTime(2026, 9, 30),  Text = "Drew 40 pixel art trees this week. Only 3 look like trees." },
            new Post { PostId = 7,  ProfileId = 3, PostedOn = new DateTime(2026, 10, 11), Text = "Cinnamon buns attempt number six. These are the ones." },
            new Post { PostId = 8,  ProfileId = 3, PostedOn = new DateTime(2026, 10, 4),  Text = "Found a tiny cafe with the best pumpkin loaf in the city." },
            new Post { PostId = 9,  ProfileId = 3, PostedOn = new DateTime(2026, 9, 27),  Text = "Halfway through knitting a scarf for the first cold day." },
            new Post { PostId = 10, ProfileId = 4, PostedOn = new DateTime(2026, 10, 10), Text = "Counted 14 seals on the rocks today. New record." },
            new Post { PostId = 11, ProfileId = 4, PostedOn = new DateTime(2026, 10, 3),  Text = "Caught the best sunset of the year from the harbour." },
            new Post { PostId = 12, ProfileId = 4, PostedOn = new DateTime(2026, 9, 26),  Text = "Lab day: looking at plankton under the microscope. So many tiny shapes." },
        };
    }
}
