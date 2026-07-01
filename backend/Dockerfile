FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /app

# Copy gradle wrapper
COPY gradlew .
COPY gradle gradle
RUN chmod +x gradlew

# Copy build files
COPY build.gradle settings.gradle ./

# Copy source code
COPY src src

# Build the application
RUN ./gradlew bootJar -x test

# Move the correct jar to a known location
RUN find build/libs -name "*.jar" -not -name "*plain*" -exec cp {} /app/app.jar \;

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=builder /app/app.jar .

# Configuração Railway / Render
EXPOSE 8080 10000

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-XX:+UseZGC", "-jar", "app.jar"]
