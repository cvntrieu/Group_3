using api.DTOs.ConversationHistory;
using api.Interfaces;
using api.Mappers;
using api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers
{
    [Route("api/conversation-history")]
    [ApiController]
    public class ConversationHistoryController : ControllerBase
    {
        private readonly IConversationHistoryRepository _conversationHistoryRepository;
        private readonly IMessageRepository _messageRepository;
        private readonly UserManager<User> _userManager;
        public ConversationHistoryController(IConversationHistoryRepository conversationHistoryRepository, IMessageRepository messageRepository, UserManager<User> userManager)
        {
            _conversationHistoryRepository = conversationHistoryRepository;
            _messageRepository = messageRepository;
            _userManager = userManager;
        }


        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetConversationHistory([FromQuery] int? limit)
        {
            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var history = await _conversationHistoryRepository.GetByUserIdAsync(userId);
            if (history == null)
                return Ok(new { Message = "No conversation history found for the user." });

            var messages = await _messageRepository.GetAllByHistoryIdAsync(history.Id);

            // Sort theo CreatedAt
            messages = messages
                .OrderBy(m => m.CreatedAt)
                .ToList();

            if (limit.HasValue)
            {
                messages = messages
                    .TakeLast(limit.Value)   // chỉ lấy n message cuối
                    .ToList();
            }

            ConversationHistoryDto historyDto = history.ToDto();
            historyDto.Messages = messages.Select(m => m.ToDto()).ToList();

            return Ok(historyDto);
        }

    }
}