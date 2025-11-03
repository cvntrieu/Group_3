using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Data;
using api.Interfaces;
using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Repositories
{
    public class MessageRepository : IMessageRepository
    {
        private readonly ApplicationDBContext _context;

        public MessageRepository(ApplicationDBContext context)
        {
            _context = context;
        }

        public async Task<Message> GetByIdAsync(int id)
        {
            return await _context.Messages.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<List<Message>> GetAllByHistoryIdAsync(int conversationHistoryId)
        {
            return await _context.Messages
                .Where(x => x.ConversationHistoryId == conversationHistoryId)
                .ToListAsync();
        }

        public async Task<List<Message>> AddAsync(List<Message> messages)
        {
            await _context.Messages.AddRangeAsync(messages);
            await _context.SaveChangesAsync();
            return messages;
        }
    }
}