import stomp
import time
import sys
import json

# Requirements: pip install stomp.py

class RateLimitListener(stomp.ConnectionListener):
    def __init__(self):
        self.messages_received = 0
        self.errors_received = 0
        self.connected = False

    def on_connected(self, frame):
        print("STOMP CONNECTED")
        self.connected = True

    def on_error(self, frame):
        print(f"Received error: {frame.body}")
        self.errors_received += 1

    def on_message(self, frame):
        print(f"Received message: {frame.body[:80]}...")
        self.messages_received += 1

    def on_disconnected(self):
        print("Disconnected")

def run_test(jwt_token, room_id, host='localhost', port=8080):
    conn = stomp.Connection([(host, port)], ws=True)
    listener = RateLimitListener()
    conn.set_listener('rate-test', listener)
    
    print(f"Connecting to STOMP server at {host}:{port}...")
    
    # stomp.py connect API: login, passcode, headers
    conn.connect(
        headers={'Authorization': f'Bearer {jwt_token}'},
        wait=True
    )
    
    if not listener.connected:
        print("❌ Failed to establish STOMP connection")
        return
    
    # Subscribe to room topic
    conn.subscribe(destination=f'/topic/room.{room_id}', id='sub-0', ack='auto')
    time.sleep(0.5)
    
    print("Sending 10 messages rapidly (100ms interval)...")
    for i in range(10):
        payload = json.dumps({
            "roomId": room_id,
            "channelId": "general",
            "content": f"Test message {i}",
            "type": "TEXT"
        })
        conn.send(
            body=payload,
            destination='/app/chat.send',
            content_type='application/json'
        )
        time.sleep(0.1)
        
    print("Waiting for responses...")
    time.sleep(3)
    
    conn.disconnect()
    
    print(f"\n--- Test Results ---")
    print(f"Messages broadcasted to room: {listener.messages_received}")
    print(f"Errors returned: {listener.errors_received}")
    
    if listener.messages_received <= 5:
        print("✅ Rate limiting SUCCESS: Allowed 5 or fewer messages per second.")
    else:
        print("❌ Rate limiting FAILED: Allowed more than 5 messages per second.")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python stomp_rate_limit_test.py <JWT_TOKEN> <ROOM_ID> [HOST] [PORT]")
        print("Example: python stomp_rate_limit_test.py eyJhbG... room123 localhost 8080")
        sys.exit(1)
    
    host = sys.argv[3] if len(sys.argv) > 3 else 'localhost'
    port = int(sys.argv[4]) if len(sys.argv) > 4 else 8080
    run_test(sys.argv[1], sys.argv[2], host, port)
