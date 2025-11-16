from storage import cache

history_messages = cache.get_history_messages()
print("History messages from backend:", history_messages)