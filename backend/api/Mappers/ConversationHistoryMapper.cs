using api.DTOs.ConversationHistory;
using api.Models;

namespace api.Mappers
{
    public static class ConversationHistoryMapper
    {
        public static ConversationHistoryDto ToDto(this ConversationHistory conversationHistory)
        {
            return new ConversationHistoryDto
            {
                Id = conversationHistory.Id,
                Messages = conversationHistory.Messages
                    .OrderBy(m => m.CreatedAt)
                    .Select(m => m.ToDto())
                    .ToList()
            };
        }
    }
}