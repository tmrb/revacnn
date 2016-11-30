# -*- coding: utf-8 -*-
import json, time
from flask import Flask, Response, jsonify, render_template, request
import gevent
from gevent.wsgi import WSGIServer
from gevent.queue import Queue
from multiprocessing import Process, Value
import pickle
import threading
import thread
import subprocess

app = Flask(__name__)
subscriptions = []

################################################################

################################################################

@app.route('/health/', methods=['GET'])
def health():
    return '200 OK'

@app.route('/', methods=['GET'])
def home():
    return render_template('index.html')

class ServerSentEvent(object):

    def __init__(self, data):
        self.data = data
        self.event = None
        self.id = None
        self.desc_map = {
            self.data : "data",
            self.event : "event",
            self.id : "id"
        }

    def encode(self):
        if not self.data:
            return ""
        lines = ["%s: %s" % (v, k) 
                 for k, v in self.desc_map.iteritems() if k]
        
        return "%s\n\n" % "\n".join(lines)

    
@app.route("/publish/epoch/end/", methods=['POST'])
def publish():
    payload = request.form.get('data')
    try:
        data = json.loads(payload)
    except:
        return {'error':'invalid payload'}

    def notify():
        msg = str(time.time())
        for sub in subscriptions[:]:
            sub.put(payload)
    
    gevent.spawn(notify)
    return "OK"


@app.route('/post_drag', methods = ['POST'])
def get_post_javascript_data():

    content = request.json
    tdata = content['tdata']
    drag = content['drag']
    #print (tdata)
    #print (drag)
    
    
    # read pickle
    pick_data = []
    pick_array = []
        
    try:
        pick_data = pickle.load(open("change_filter.p", "rb"))
        pick_array = []
        
        if pick_data[0]:
            pick_array = pick_data[1]
            pick_array.append([tdata, drag])
        else:
            pick_array = [[tdata, drag]]
        #
        pick_data = [True, pick_array]

    except IOError:
        print "no pickle"
        pick_array = [[tdata, drag]]
        pick_data = [True, pick_array]
        
    
    print ("Write Pickle")
    
    pickle.dump(pick_data, open("change_filter.p", "wb"))
    
    return "OK"

@app.route("/subscribe/epoch/end/")
def subscribe():
    def gen():
        q = Queue()
        subscriptions.append(q)
        try:
            while True:
                result = q.get()
                event = ServerSentEvent(str(result))
                yield event.encode()
        except GeneratorExit:
            subscriptions.remove(q)

    return Response(gen(), mimetype="text/event-stream")

def run_script():
    #print "run script"
    subprocess.call(["python /home/sunghyo/git_project/revacnn/train_model.py"], shell=True)
    
@app.route('/run_model/')
def run_model():

    threading.Thread(target=lambda: run_script()).start()
    return "OK"

@app.route('/test/')
def test():
    print "hi"


if __name__ == "__main__":
    app.debug = False
    app.use_reloader=False
    
    server = WSGIServer(("", 5000), app)
    server.serve_forever()
    
    
