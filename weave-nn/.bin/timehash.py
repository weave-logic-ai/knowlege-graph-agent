import time
import base64

def generate_short_hash(length=6):
    seconds = int(time.time()) & 0xFFFFFFFFF
    hash_bytes = seconds.to_bytes(5, byteorder='big')
    short_hash = base64.urlsafe_b64encode(hash_bytes).decode('ascii').rstrip('=')
    return short_hash[:length]

if __name__ == "__main__":
    print(generate_short_hash())
