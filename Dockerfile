# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# Copy gradle wrapper and config from backend folder
COPY backend/gradle/ gradle/
COPY backend/gradlew backend/build.gradle backend/settings.gradle ./

RUN chmod +x ./gradlew

# Download dependencies first
RUN ./gradlew dependencies --no-daemon

# Copy source code
COPY backend/src ./src

# Build the application
RUN ./gradlew build -x test --no-daemon

# Stage 2: Run
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-Xmx256m", "-Xss512k", "-XX:TieredStopAtLevel=1", "-jar", "app.jar"]
