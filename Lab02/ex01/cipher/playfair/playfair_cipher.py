class PlayfairCipher:
    def __init__(self) -> None:
        pass

    def __init__(self):
        pass
    
    def create_playfair_matrix(self, key):
        key = key.replace("J", "I").upper()
        seen = set()
        matrix = []
        # Chỉ thêm ký tự mới vào ma trận
        for ch in key:
            if ch not in seen and ch.isalpha():
                seen.add(ch)
                matrix.append(ch)

        alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ"
        for ch in alphabet:
            if ch not in seen:
                matrix.append(ch)
                if len(matrix) == 25:
                    break

        # Chia thành 5×5
        return [matrix[i:i+5] for i in range(0,25,5)]
    
    def find_letter_coords(self, letter, matrix):
        for row in range(len(matrix)):
            for col in range(len(matrix[row])):
                if matrix[row][col] == letter:
                    return row, col
                
    def playfair_encrypt(self, plain_text, matrix):
        plain_text = plain_text.replace('J', 'I')
        plain_text = plain_text.upper()
        encrypted_text = ""
        
        for i in range(0, len(plain_text), 2):
            pair = plain_text[i:i + 2]
            if len(pair) == 1:
                pair += "X"
            row1, col1 = self.find_letter_coords(pair[0], matrix)
            row2, col2 = self.find_letter_coords(pair[1], matrix)
            
            if row1 == row2:
                encrypted_text += matrix[row1][(col1 + 1) % 5] + matrix[row2][(col2 + 1) % 5]
            
            elif col1 == col2:
                encrypted_text += matrix[(row1 + 1) % 5][col1] + matrix[(row2 + 1) % 5][col2]
         
            else:
                encrypted_text += matrix[row1][col2] + matrix[row2][col1]
        
        return encrypted_text
    
    def playfair_decrypt(self, cipher_text, matrix):
        cipher_text = cipher_text.upper()
        decrypted_text = ""

        for i in range(0, len(cipher_text), 2):
            pair = cipher_text[i:i + 2]
            row1, col1 = self.find_letter_coords(pair[0], matrix)
            row2, col2 = self.find_letter_coords(pair[1], matrix)

            if row1 == row2:  
                decrypted_text += matrix[row1][(col1 - 1) % 5] + matrix[row2][(col2 - 1) % 5]
            elif col1 == col2: 
                decrypted_text += matrix[(row1 - 1) % 5][col1] + matrix[(row2 - 1) % 5][col2]
            else:  
                decrypted_text += matrix[row1][col2] + matrix[row2][col1]

        banro = ""
        for i in range(0, len(decrypted_text)-2, 2):
            if decrypted_text[i] == decrypted_text[i+2]:
                banro += decrypted_text[i]
            else:
                banro += decrypted_text[i] + "" + decrypted_text[i+1]
        if decrypted_text[-1] == "X":
            banro += decrypted_text[-2]
        else:
            banro += decrypted_text[-2]
            banro += decrypted_text[-1]
        return banro