import { fileURLToPath } from 'node:url';
import path from 'path';
import { requireAll  } from '@/utils/file';

const configInterface = requireAll(path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'modules'));

export default configInterface;
