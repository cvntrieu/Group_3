using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.Models
{
    public class Message
    {
        public int Id { get; set; }
        public int ConversationHistoryId { get; set; }
        public ConversationHistory ConversationHistory { get; set; } = null!;
        public int SenderType { get; set; } // 0 = User, 1 = Bot
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}