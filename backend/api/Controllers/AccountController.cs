using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.DTOs.Account;
using api.Interfaces;
using api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers
{
    [Route("api/account")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly ITokenService _tokenService;
        public AccountController(UserManager<User> userManager, ITokenService tokenService)
        {
            _userManager = userManager;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var user = new User
                {
                    UserName = registerDto.Username,
                };

                var createdUser = await _userManager.CreateAsync(user);
                if (!createdUser.Succeeded)
                {
                    var errors = createdUser.Errors.Select(e => e.Description);
                    return BadRequest(new { Errors = errors });
                }

                var addRoleResult = await _userManager.AddToRoleAsync(user, "User");
                if (!addRoleResult.Succeeded)
                {
                    var errors = addRoleResult.Errors.Select(e => e.Description);
                    return BadRequest(new { Errors = errors });
                }

                var newUser = new NewUserDto
                {
                    Username = user.UserName,
                    Token = _tokenService.CreateToken(user)
                };

                return Ok(new { Message = "User registered successfully", User = newUser });
            }
            catch (Exception e)
            {
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var user = await _userManager.Users.FirstOrDefaultAsync(u => u.UserName == loginDto.Username);
                if (user == null)
                {
                    return Unauthorized("Invalid username or password");
                }

                var loggedInUser = new LoggedInUserDto
                {
                    Username = user.UserName,
                    Token = _tokenService.CreateToken(user)
                };

                return Ok(new { Message = "Login successful", User = loggedInUser });
            }
            catch (Exception e)
            {
                return StatusCode(500, "Internal server error");
            }
        }
    }
}