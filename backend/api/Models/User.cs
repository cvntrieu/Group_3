using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace api.Models
{
    public class User : IdentityUser
    {
        public int ConversationHistoryId { get; set; }
        public ConversationHistory ConversationHistory { get; set; } = null!;
    }
}