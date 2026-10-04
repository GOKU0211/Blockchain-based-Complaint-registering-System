from flask import Flask, request, jsonify, render_template
from blockchain import Blockchain

app = Flask(__name__)
chain = Blockchain()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/complaints", methods=["POST"])
def add_complaint():
    d = request.get_json()
    if not d or not d.get("text") or not d.get("txHash"):
        return jsonify(error="Missing data"), 400
    block = chain.add_block({
        "text": d["text"],
        "wallet": d.get("wallet"),
        "onchain_id": d.get("onchainId"),
        "tx_hash": d["txHash"],
    })
    return jsonify(ok=True, block=block.to_dict()), 201


@app.route("/chain")
def view_chain():
    return jsonify(chain.to_list())


@app.route("/verify")
def verify():
    valid, bad_index = chain.is_chain_valid()
    return jsonify(valid=valid, broken_at_block=bad_index)


if __name__ == "__main__":
    app.run(debug=True)