FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /workspace

COPY gradlew .
COPY gradle ./gradle
COPY build.gradle settings.gradle .
COPY src ./src

RUN chmod +x gradlew && ./gradlew clean bootJar -x test

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S clicksmile && adduser -S clicksmile -G clicksmile

COPY --from=build /workspace/build/libs/*.jar /app/app.jar

USER clicksmile

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]