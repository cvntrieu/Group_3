using api.DTOs.Message;

namespace api.DTOs.ConversationHistory
{
    public class ConversationHistoryDto
    {
        public int Id { get; set; }
        public List<MessageDto> Messages { get; set; } = new List<MessageDto>();
    }
}