import webview
import os
import sys

def main():
    # Путь к index.html в текущей директории
    current_dir = os.path.dirname(os.path.abspath(__file__))
    html_path = os.path.join(current_dir, 'index.html')

    # Проверка существования файла
    if not os.path.exists(html_path):
        print(f"Ошибка: Файл index.html не найден в директории {current_dir}")
        sys.exit(1)

    # Создание и настройка окна
    window = webview.create_window(
        title='HTML Application',
        url=html_path,
        width=1024,
        height=768,
        resizable=True
    )
    
    # Запуск приложения
    webview.start()

if __name__ == '__main__':
    main()