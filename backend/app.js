import { Kafka } from "kafkajs";
import { createLogger, format, transports } from "winston";
import { WebSocketServer } from "ws";

// Create a logger for logging messages
const logger = createLogger({
  level: "info",
  format: format.json(),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "error.log", level: "error" }),
    new transports.File({ filename: "combined.log" }),
  ],
});

// Create a Kafka client
const kafka = new Kafka({
  brokers: ["127.0.0.1:9092"],
});

// Create a producer for publishing messages to a topic
const producer = kafka.producer();
await producer.connect();
logger.info("Producer connected to Kafka");

// Create a WebSocket server
const wss = new WebSocketServer({ port: 8080 });

// Listen for incoming connections
wss.on("connection", async (ws) => {
  logger.info("New connection from client");

  // Listen for publish messages
  ws.on("message", async (message) => {
    const data = JSON.parse(message);

    if (data.type === "publish") {
      // Publish the message to the topic
      await producer.send({
        topic: data.topic,
        messages: [{ value: data.message }],
      });
      ws.send(
        JSON.stringify({
          type: "result",
          result: "Message published successfully",
        })
      );
      logger.info(`Message published to topic ${data.topic}: ${data.message}`);
    }
  });

  // Create a consumer for consuming messages from a topic
  const consumer = kafka.consumer({ groupId: "my-group" });
  await consumer.connect();
  await consumer.subscribe({ topic: "my-topic" });
  logger.info("Consumer connected to Kafka and subscribed to topic");

  // Listen for messages from the topic
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      ws.send(
        JSON.stringify({
          type: "message",
          message: message.value.toString(),
        })
      );
      logger.info(
        `Message received from topic ${topic}: ${message.value.toString()}`
      );
    },
  });
});
