import { defineConfig } from 'vite';
import { siteAssetsPlugin } from '../theme/dev-site-public';

export default defineConfig({
  plugins: [siteAssetsPlugin()],
});
