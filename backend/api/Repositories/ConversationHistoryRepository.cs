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
    public class ConversationHistoryRepository : IConversationHistoryRepository
    {
        private readonly ApplicationDBContext _context;

        public ConversationHistoryRepository(ApplicationDBContext context)
        {
            _context = context;
        }

        public Task<ConversationHistory> CreateAsync(ConversationHistory history)
        {
            _context.ConversationHistories.Add(history);
            _context.SaveChanges();
            return Task.FromResult(history);
        }

        public async Task<ConversationHistory> GetByIdAsync(int id)
        {
            return await _context.ConversationHistories.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<ConversationHistory> GetByUserIdAsync(string userId)
        {
            return await _context.ConversationHistories
                .Where(x => x.UserId == userId)
                .FirstOrDefaultAsync();
        }

    }
}