using api.DTOs.ConversationHistory;
using api.DTOs.Message;
using api.Models;

namespace api.Mappers
{
    public static class MessageMapper
    {
        public static MessageDto ToDto(this Message message)
        {
            return new MessageDto
            {
                Id = message.Id,
                SenderType = message.SenderType,
                Content = message.Content,
                CreatedAt = message.CreatedAt
            };
        }

        public static Message ToModel(this MessageDto messageDto, int conversationHistoryId, ConversationHistory conversationHistory)
        {
            return new Message
            {
                Id = messageDto.Id,
                ConversationHistoryId = conversationHistoryId,
                ConversationHistory = conversationHistory,
                SenderType = messageDto.SenderType,
                Content = messageDto.Content,
                CreatedAt = messageDto.CreatedAt
            };
        }

        public static Message ToModel(this CreateMessageDto messageDto, int conversationHistoryId, ConversationHistory conversationHistory)
        {
            return new Message
            {
                ConversationHistoryId = conversationHistoryId,
                ConversationHistory = conversationHistory,
                SenderType = messageDto.SenderType,
                Content = messageDto.Content,
                CreatedAt = messageDto.CreatedAt
            };
        }
    }
}