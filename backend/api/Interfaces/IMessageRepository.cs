using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models;

namespace api.Interfaces
{
    public interface IMessageRepository
    {
        Task<Message> GetByIdAsync(int id);
        Task<List<Message>> GetAllByHistoryIdAsync(int conversationHistoryId);
        Task<List<Message>> AddAsync(List<Message> messages);
    }
}