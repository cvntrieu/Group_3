using api.DTOs.Message;
using api.Interfaces;
using api.Mappers;
using api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;

namespace api.Controllers
{
    [Route("api/messages")]
    [ApiController]
    public class MessageController : ControllerBase
    {
        private readonly IConversationHistoryRepository _conversationHistoryRepository;
        private readonly IMessageRepository _messageRepository;
        private readonly UserManager<User> _userManager;

        public MessageController(IConversationHistoryRepository conversationHistoryRepository, IMessageRepository messageRepository, UserManager<User> userManager)
        {
            _conversationHistoryRepository = conversationHistoryRepository;
            _messageRepository = messageRepository;
            _userManager = userManager;
        }

        [HttpPost]
        public async Task<IActionResult> AddMessage([FromBody] List<CreateMessageDto> message)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = _userManager.GetUserId(User);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                var history = await _conversationHistoryRepository.GetByUserIdAsync(userId);
                if (history == null)
                {
                    history = new ConversationHistory
                    {
                        UserId = userId,
                        CreatedAt = DateTime.Now
                    };
                    history = await _conversationHistoryRepository.CreateAsync(history);
                }

                List<Message> messages = message.Select(m => m.ToModel(history.Id, history)).ToList();
                var createdMessages = await _messageRepository.AddAsync(messages);

                return Ok(createdMessages.Select(m => m.ToDto()));
            }
            catch (Exception)
            {
                return StatusCode(500, "Internal server error");
            }

        }
    }
}