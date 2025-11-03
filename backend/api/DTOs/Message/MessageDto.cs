namespace api.DTOs.Message
{
    public class MessageDto
    {
        public int Id { get; set; }
        public int SenderType { get; set; } // 0 = User, 1 = Bot
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}