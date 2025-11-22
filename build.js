const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

// Clean dist folder
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true, force: true });
}
fs.mkdirSync('dist', { recursive: true });

// Copy static files
const copyFiles = [
  { from: 'manifest.json', to: 'dist/manifest.json' },
  { from: 'src/presentation/popup/popup.html', to: 'dist/popup.html' },
  { from: 'src/presentation/popup/popup.css', to: 'dist/popup.css' },
  { from: 'src/presentation/options/options.html', to: 'dist/options.html' },
  { from: 'src/presentation/options/options.css', to: 'dist/options.css' }
];

// Copy icons folder
if (fs.existsSync('public/icons')) {
  fs.mkdirSync('dist/icons', { recursive: true });
  fs.readdirSync('public/icons').forEach(file => {
    fs.copyFileSync(
      path.join('public/icons', file),
      path.join('dist/icons', file)
    );
  });
}

copyFiles.forEach(({ from, to }) => {
  if (fs.existsSync(from)) {
    fs.copyFileSync(from, to);
  }
});

// Build background separately (service worker needs special handling)
const backgroundOptions = {
  entryPoints: ['src/infrastructure/chrome/background.js'],
  bundle: true,
  outfile: 'dist/background.js',
  platform: 'browser',
  target: 'chrome100',
  format: 'iife',
  minify: false,
  sourcemap: false,
};

// Build other scripts
const scriptsOptions = {
  entryPoints: {
    'content': 'src/infrastructure/content/content.js',
    'popup': 'src/presentation/popup/popup.js',
    'options': 'src/presentation/options/options.js'
  },
  bundle: true,
  outdir: 'dist',
  platform: 'browser',
  target: 'chrome100',
  format: 'iife',
  splitting: false,
  minify: false,
  sourcemap: false,
};

async function build() {
  try {
    if (isWatch) {
      const bgCtx = await esbuild.context(backgroundOptions);
      const scriptsCtx = await esbuild.context(scriptsOptions);
      await Promise.all([bgCtx.watch(), scriptsCtx.watch()]);
      console.log('Watching for changes...');
    } else {
      await Promise.all([
        esbuild.build(backgroundOptions),
        esbuild.build(scriptsOptions)
      ]);
      console.log('Build completed successfully!');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
