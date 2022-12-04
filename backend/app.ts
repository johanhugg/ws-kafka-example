import cuid from "cuid";
import { Kafka, logLevel, LogEntry } from "kafkajs";
import winston, { createLogger, format, transports } from "winston";
import { WebSocketServer } from "ws";

// Create a logger for logging messages
const logger = createLogger({
  level: "info",
  format: format.json(),
  transports: [
      new winston.transports.Console({
      format: winston.format.combine(
        // Only use colors if we are in dev mode
        winston.format.colorize({ all: process.env.NODE_ENV === 'dev' }),
        winston.format.simple()
      )
    }),
    new transports.File({ filename: "error.log", level: "error" }),
    new transports.File({ filename: "combined.log" }),
  ],
});

const toWinstonLogLevel = (level: any) => {
  switch (level) {
      case logLevel.ERROR:
      case logLevel.NOTHING:
          return 'error'
      case logLevel.WARN:
      default:
          return 'warn'
      case logLevel.INFO:
          return 'info'
      case logLevel.DEBUG:
          return 'debug'
  }
};

const WinstonLogCreator = (_logLevel: logLevel) => {
  return ({ namespace, level, label, log }: LogEntry) => {
      const { message, ...extra } = log
      logger.log({
          level: toWinstonLogLevel(level),
          message,
          extra,
      })
  }
};

// Create a Kafka client
const kafka = new Kafka({
  brokers: ["127.0.0.1:9092"],
  logLevel: process.env.NODE_ENV === "dev" ? logLevel.DEBUG : logLevel.INFO,
  logCreator: WinstonLogCreator,
});

// Create a producer for publishing messages to a topic
const producer = kafka.producer();
producer.connect();
logger.info("Producer connected to Kafka");

// Create a WebSocket server
const wss = new WebSocketServer({ port: 8080 });

// Keep track of all connected clients
let clients: { [n: string]: any } = {} 

// Listen for incoming connections
wss.on("connection", async (ws) => {
  logger.info("New connection from client");

  const id = cuid()
  clients[id] = ws;

  ws.on("close", function () {
    logger.info("Client disconnected, deleting");
    delete clients[id];
  });
  // Listen for publish messages
  ws.on("message", async (message) => {
    const data = JSON.parse(message.toString());
    const dataWithId = JSON.stringify({ ...data, clientId: id });

    if (data.type === "publish") {
      // Publish the message to the topic
      await producer.send({
        topic: data.topic,
        messages: [{ value: dataWithId }],
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
  // Start consuming messages from the topic
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      logger.info(`Message received from topic ${topic}: ${message.value}, clientsIds: ${Object.keys(clients)}`);
      // Send the message to the client
      const data = JSON.parse(message.value ? message.value.toString() : "");
      for (let clientId in clients) {
        if (clientId !== data.id) {
          clients[clientId].send(
            JSON.stringify({
              type: "message",
              topic: topic,
              partition: partition,
              message: data.message,
            })
          );
        }
      }
      logger.info(
        `Message received from topic ${topic}: ${message.value?.toString()}`
      );
    },
  });
});
