import hashlib

def calculate_md5_hash(input_string):
    md5_hash = hashlib.md5() 
    md5_hash.update(input_string.encode('utf-8'))

    return md5_hash.hexdigest()

data_to_hash = input("Enter the string to hash bằng SHA-256: ")
hash_value = calculate_md5_hash(data_to_hash)
print("Giá trị hash SHA 256:", hash_value)