#!/bin/bash

# Pull the latest hexo branch
git checkout hexo

# Commit and push changes to main branch
git add .
git commit -m "Deploy new content"
git push origin hexo

# Generate static files
hexo clean && hexo generate && hexo deploy

cd /blog-original/ && hexo clean && hexo generate && hexo deploy
# hexo new post "test"