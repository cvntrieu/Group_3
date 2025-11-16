from functions import handle_describe_image

if __name__ == "__main__":
    img_path = "image/anh1.jpg"     
    max_words = 20              
    result = handle_describe_image(img_path, max_words)
    print("Mô tả ảnh:", result)