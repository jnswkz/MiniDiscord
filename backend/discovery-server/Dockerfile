# ── Stage 1: Build ──────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build

# Layer 1: Copy tất cả pom.xml (parent + modules) → cache dependencies
COPY pom.xml .
COPY common-lib/pom.xml ./common-lib/pom.xml
COPY discovery-server/pom.xml ./discovery-server/pom.xml
COPY api-gateway/pom.xml ./api-gateway/pom.xml
COPY user-service/pom.xml ./user-service/pom.xml
COPY group-channel-service/pom.xml ./group-channel-service/pom.xml
COPY chat-history-service/pom.xml ./chat-history-service/pom.xml
COPY messaging-service/pom.xml ./messaging-service/pom.xml
COPY file-service/pom.xml ./file-service/pom.xml
COPY config-server/pom.xml ./config-server/pom.xml

# Layer 2: Download dependencies (cached nếu pom.xml không đổi)
RUN mvn -pl common-lib,discovery-server -am dependency:go-offline -q -B

# Layer 3: Copy source code (chỉ layer này thay đổi khi sửa code)
COPY common-lib/src ./common-lib/src
COPY discovery-server/src ./discovery-server/src

# Layer 4: Build
RUN mvn -pl common-lib,discovery-server -am clean package -DskipTests -q

# ── Stage 2: Runtime ────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /build/discovery-server/target/*.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
