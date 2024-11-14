import os
from datetime import datetime
from typing import Dict, List, Set
from collections import defaultdict
from pathlib import Path

class FileCategories:
    def __init__(self):
        self.categories = {
            'project_info': {
                'description': 'Información del proyecto y configuración básica',
                'paths': {'package.json', 'README.md'},
                'extensions': {'.json', '.js', '.ts', '.md'}
            },
            'backend': {
                'description': 'Backend completo: servidor, APIs y base de datos',
                'patterns': {'backend/'},
                'extensions': {'.js', '.ts', '.sql'}
            },
            'frontend_core': {
                'description': 'Núcleo del frontend',
                'patterns': {'frontend/src/'},
                'exclude_patterns': {'frontend/src/components/'},
                'extensions': {'.ts', '.tsx', '.css'}
            },
            'frontend_components': {
                'description': 'Componentes del frontend',
                'patterns': {'frontend/src/components/'},
                'extensions': {'.tsx', '.ts'}
            }
        }

def should_exclude(filename: str) -> bool:
    excluded = {'package-lock.json', 'node_modules'}
    excluded_extensions = {'.txt', '.sh', '.py', '.log', '.git', '.env'}
    return any(filename.endswith(ext) for ext in excluded_extensions) or \
           any(excl in filename for excl in excluded) or \
           '/node_modules/' in filename.replace('\\', '/')

def get_relative_path(base_path: str, file_path: str) -> str:
    return os.path.relpath(file_path, base_path).replace('\\', '/')

def write_tree(file, start_path: str, current_path: str = None, prefix: str = '') -> None:
    if current_path is None:
        current_path = start_path
        
    items = os.listdir(current_path)
    items.sort(key=lambda x: (not os.path.isdir(os.path.join(current_path, x)), x.lower()))
    
    for index, item in enumerate(items):
        if should_exclude(item):
            continue
        
        item_path = os.path.join(current_path, item)
        is_last = index == len(items) - 1
        current_prefix = '└── ' if is_last else '├── '
        next_level_prefix = '    ' if is_last else '│   '
        
        file.write(f'{prefix}{current_prefix}{item}\n')
        
        if os.path.isdir(item_path) and 'node_modules' not in item:
            write_tree(file, start_path, item_path, prefix + next_level_prefix)

def get_file_category(relative_path: str, categories: FileCategories) -> str:
    normalized_path = relative_path.replace('\\', '/')
    _, ext = os.path.splitext(normalized_path)
    filename = os.path.basename(normalized_path)

    for category, rules in categories.categories.items():
        # Verificar paths exactos primero
        if filename in rules.get('paths', set()):
            return category

        # Verificar patrones de exclusión
        if 'exclude_patterns' in rules:
            if any(pattern in normalized_path for pattern in rules['exclude_patterns']):
                continue

        # Verificar patrones de inclusión y extensiones
        if (any(pattern in normalized_path for pattern in rules.get('patterns', set())) and
            ext in rules.get('extensions', set())):
            return category

        # Para project_info, verificar solo extensiones en la raíz
        if category == 'project_info' and ext in rules.get('extensions', set()):
            if normalized_path.count('/') <= 1:  # Archivos en la raíz o primer nivel
                return category

    return 'project_info'  # Categoría por defecto

def write_file_header(file, category: str, categories: FileCategories, file_contents: Dict[str, List[str]]) -> None:
    file.write('Este es mi proyecto. Memoriza el código y toda la información. ')
    file.write('Mas adelante te pediré modificaciones. Contesta siempre en español, ')
    file.write('con el código completo, y añadiendo en la primera linea del código la ruta del fichero. ')
    file.write('Dame los ficheros de código de uno en uno.\n')
    file.write('No cambies nada sin que yo te lo pida o preguntando antes.\n\n')
    
    file.write(f'Category: {category}\n')
    file.write(f'Description: {categories.categories[category]["description"]}\n')
    file.write(f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}\n')
    file.write('='*80 + '\n\n')

    # Escribir índice de contenidos
    file.write('Contents:\n')
    file.write('-'*80 + '\n')
    for filepath in sorted(file_contents[category]):
        file.write(f'- {filepath}\n')
    file.write('\n' + '='*80 + '\n\n')

def generate_category_files(start_path: str) -> None:
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    categories = FileCategories()
    file_handles: Dict[str, object] = {}
    file_contents: Dict[str, List[str]] = defaultdict(list)
    
    try:
        # Primera pasada: recopilar contenidos por categoría
        for root, dirs, files in os.walk(start_path):
            if 'node_modules' in dirs:
                dirs.remove('node_modules')
            
            for filename in files:
                if should_exclude(filename):
                    continue
                
                abs_path = os.path.join(root, filename)
                rel_path = get_relative_path(start_path, abs_path)
                category = get_file_category(rel_path, categories)
                file_contents[category].append(rel_path)

        # Segunda pasada: crear y escribir archivos
        for category in categories.categories.keys():
            filename = f'proyecto_{category}_{timestamp}.txt'
            file_handles[category] = open(filename, 'w', encoding='utf-8')
            write_file_header(file_handles[category], category, categories, file_contents)
            print(f"Created file for category: {category}")

        # Escribir árbol de directorios solo en project_info
        file_handles['project_info'].write('Directory Structure:\n')
        file_handles['project_info'].write('-'*80 + '\n')
        write_tree(file_handles['project_info'], start_path)
        file_handles['project_info'].write('\n\nFile Contents:\n')
        file_handles['project_info'].write('='*80 + '\n')

        # Escribir contenidos de archivos
        for root, dirs, files in os.walk(start_path):
            if 'node_modules' in dirs:
                dirs.remove('node_modules')
            
            for filename in files:
                if should_exclude(filename):
                    continue
                
                abs_path = os.path.join(root, filename)
                rel_path = get_relative_path(start_path, abs_path)
                
                try:
                    with open(abs_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    category = get_file_category(rel_path, categories)
                    file_handles[category].write('\n' + '='*80 + '\n')
                    file_handles[category].write(f'File: {rel_path}\n')
                    file_handles[category].write('-'*80 + '\n')
                    file_handles[category].write(content)
                    file_handles[category].write('\n')
                except Exception as e:
                    print(f'Error reading {rel_path}: {str(e)}')

    except Exception as e:
        print(f"An error occurred: {str(e)}")
    finally:
        # Cerrar todos los archivos
        for file in file_handles.values():
            file.close()

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    try:
        generate_category_files(script_dir)
        print("Files generated successfully!")
    except Exception as e:
        print(f"Error: {str(e)}")