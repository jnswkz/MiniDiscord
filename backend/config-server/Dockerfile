FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build

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
RUN mvn -pl common-lib,config-server -am dependency:go-offline -q -B

COPY common-lib/src ./common-lib/src
COPY config-server/src ./config-server/src
RUN mvn -pl common-lib,config-server -am clean package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /build/config-server/target/*.jar app.jar
EXPOSE 8888
ENTRYPOINT ["java", "-jar", "app.jar"]
