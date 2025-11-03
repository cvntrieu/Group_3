using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.DTOs.Message
{
    public class CreateMessageDto
    {
        public int SenderType { get; set; } // 0 = User, 1 = Bot
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}