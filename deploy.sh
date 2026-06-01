#!/bin/bash
echo "Building..."
npm run build
echo "Deploying to Vercel..."
vercel --prod
