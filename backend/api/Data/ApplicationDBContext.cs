using System.Data;
using api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace api.Data
{
    public class ApplicationDBContext : IdentityDbContext<User>
    {
        public ApplicationDBContext(DbContextOptions<ApplicationDBContext> dbContextOptions)
            : base(dbContextOptions)
        {

        }

        public DbSet<ConversationHistory> ConversationHistories { get; set; }
        public DbSet<Message> Messages { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            List<IdentityRole> roles = new List<IdentityRole>
            {
                new IdentityRole
                {
                    Id = "1",
                    Name = "User",
                    NormalizedName = "USER"
                },
                new IdentityRole
                {
                    Id = "2",
                    Name = "Admin",
                    NormalizedName = "ADMIN"
                }
            };
            builder.Entity<IdentityRole>().HasData(roles);

            builder.Entity<ConversationHistory>()
                .HasMany(ch => ch.Messages)
                .WithOne(m => m.ConversationHistory)
                .HasForeignKey(m => m.ConversationHistoryId)
                .OnDelete(DeleteBehavior.Cascade);

            // Configure one-to-one relationship between User and ConversationHistory
            // Use ConversationHistory.UserId as the foreign key (dependent side)
            builder.Entity<User>()
                .HasOne(u => u.ConversationHistory)
                .WithOne(ch => ch.User)
                .HasForeignKey<ConversationHistory>(ch => ch.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}