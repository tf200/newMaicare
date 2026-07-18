# Default recipe: build and deploy the app
default: deploy

# Build the application with dev environment variables (.env.dev)
build:
    bun run build --mode dev

# Build and deploy the application to root@167.86.75.250
deploy: build
    rsync -avz --delete build/ root@167.86.75.250:/var/www/app.maicare.online/
    ssh root@167.86.75.250 "chown -R www-data:www-data /var/www/app.maicare.online"
