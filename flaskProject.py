from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/')
def homepage():
    return render_template('homepage.html',title='homepage')

@app.route('/cheatingfootage')
def cheating_footage():
    current_path = request.path
    return render_template('cheating_footage.html',title='cheating footage'
                           ,current_path = current_path)
@app.route('/monitoring')
def monitoring():
    return render_template('monitoring.html',title='monitoring')

if __name__ == "__main__":
    app.run(debug=True)
