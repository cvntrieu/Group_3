using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Data;
using api.Models;

namespace api.Interfaces
{
    public interface IConversationHistoryRepository
    {
        Task<ConversationHistory> GetByIdAsync(int id);
        Task<ConversationHistory> GetByUserIdAsync(string userId);
        Task<ConversationHistory> CreateAsync(ConversationHistory history);
    }
}