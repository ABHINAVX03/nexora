# Multi-stage Dockerfile for config-server
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install git for Git-backed configuration loading
RUN apk add --no-cache git && \
    addgroup -S appgroup && adduser -S appuser -G appgroup && \
    mkdir -p /app/logs && chown -R appuser:appgroup /app

COPY --from=builder /build/target/*.jar app.jar

USER appuser:appgroup

EXPOSE 8888

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
