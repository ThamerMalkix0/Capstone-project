from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def homepage():
    return render_template('homepage.html',title='homepage')

@app.route('/cheatingfootage')
def cheating_footage():
    return render_template('cheating_footage.html',title='cheating footage')


@app.route('/monitoring')
def monitoring():
    return render_template('monitoring.html',title='monitoring')

if __name__ == "__main__":
    app.run(debug=True)

