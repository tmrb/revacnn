from keras import callbacks
from sklearn.manifold import TSNE
import time
import json
import warnings
import sys
import numpy as np
import keras
from keras import backend as K
import tensorflow as tf
import pickle
import os
################################################################
def set_weight_by_drag(tdata, drag, nmodel, layer_num):
    # set variables
    drag_x = drag['x']
    drag_y = drag['y']
    drag_i = drag['i']
    old_weight = nmodel.get_weights()
    old_weight = np.array(old_weight)
    old_layer_weight = old_weight[layer_num]
    
    #
    perplexity = 4
    #
    
    euclidean_list = get_euclidean_i(tdata, [drag_x, drag_y])
    this_dist = euclidean_list[drag_i]['d']
    
    import operator
    euclidean_list.sort(key=operator.itemgetter('d'))
    
    candidates = euclidean_list[0:perplexity]
    
    for item in candidates:
        if (item['i'] == drag_i):
            candidates.append(euclidean_list[perplexity])
            break
            
        
    total_reverse_sum = sum((1 / item['d']) for item in candidates)
    
    new_filter = np.zeros(old_layer_weight[drag_i].shape)
    
    for cand in candidates:
        constant = ((1/cand['d']) / total_reverse_sum)
        partial_filter = np.multiply(old_layer_weight[cand['i']], constant)
        
        new_filter = np.add(new_filter, partial_filter)
    
    #print (old_weight[layer_num][drag_i])
    old_weight[layer_num][drag_i] = new_filter
    #print (old_weight[layer_num][drag_i])
        
    return old_weight.tolist()

def get_euclidean_i(tdata, source):
    tdata = np.array(tdata)
    source = np.array(source)
    
    def dist(a,b):
        return np.sqrt(np.sum((a-b)**2))
    
    dist_list = []
    
    for i in range(len(tdata)):
        dist_list.append({'d': dist(tdata[i], source), 'i':i})
    
    return dist_list

################################################################
    
class FilterChangeRemote(callbacks.Callback):

    def __init__(self,
                 root='http://localhost:5000',
                 path='/publish/epoch/end/',
                 field='data'):
        super(FilterChangeRemote, self).__init__()
        self.root = root
        self.path = path
        self.field = field

    def on_epoch_end(self, epoch, logs={}):
        
        pick_data = []
        
        try:
            pick_data = pickle.load(open("change_filter.p", "rb"))
            if pick_data[0]:
                print ("")
                print("Change filter weight")

                for moved in pick_data[1]:

                    tdata = moved[0]
                    drag = moved[1]
                    
                    print ("Filter: %d") % (drag['i'])
                        
                    new_weight = set_weight_by_drag(tdata, drag, self.model, 0)
                    self.model.set_weights(new_weight)
                #

                #
                print ("remove change_filter.p")
                os.remove("change_filter.p")
            
        except IOError:
            print "no pickle"

################################################################

class GraphRemote(callbacks.Callback):

    def __init__(self,
                 root='http://localhost:9000',
                 path='/publish/epoch/end/',
                 field='data',
                old_weight=np.zeros(288)):
        super(GraphRemote, self).__init__()
        self.root = root
        self.path = path
        self.field = field
        self.old_weight = old_weight
        
    def get_weight_changes(self, new_weight, num_layer):
        
        change = np.subtract(self.old_weight[num_layer], new_weight[num_layer])
        size = change.size
        change = np.absolute(change)
        change = np.sum(change)
        
        return float(change / size)
    
    
    def get_filter_changes(self, new_weight, num_layer):
        
        change = np.subtract(self.old_weight[num_layer], new_weight[num_layer])
        change = np.absolute(change)
        change = change.reshape(change.shape[0], change.shape[1] * change.shape[2] * change.shape[3])
        change = np.sum(change, axis=1)
    
        return change.tolist()

    def on_epoch_end(self, epoch, logs={}):
        weight = self.model.get_weights()
        
        change0 = self.get_weight_changes(weight, 0)
        change2 = self.get_weight_changes(weight, 2)
        change4 = self.get_weight_changes(weight, 4)
        
        change_filters = self.get_filter_changes(weight, 0)
        #print (change_filters);
        
        self.old_weight = weight
    
        import requests
        send = {}
        send['type'] = 'graph'
        send['epoch'] = epoch
        for k, v in logs.items():
            send[k] = v
        
        send['ch0'] = change0
        send['ch2'] = change2
        send['ch4'] = change4

#         send['lr'] = float(K.get_value(model.optimizer.lr))
                
        try:
            requests.post(self.root + self.path,
                          {self.field: json.dumps(send)})
        except:
            print('Warning: could not reach RemoteMonitor '
                  'root server at ' + str(self.root))
            

################################################################

def post_data_to_server(model):
    
    root='http://localhost:5000'
    path='/publish/epoch/end/'
    field='data'
    
    weight = model.get_weights()
    layer_weight = weight[0]
    
    import requests
    send = {}
    send['data'] = 'tsne'
    send['weight'] = layer_weight.tolist()

    try:
        requests.post(root + path, {field: json.dumps(send)})
    except:
        print('Warning: could not reach RemoteMonitor '
              'root server at ' + str(root))
        
import pylab as plt
import cv2
import matplotlib.cm as cm
from mpl_toolkits.axes_grid1 import make_axes_locatable

def nice_imshow(ax, data, vmin=None, vmax=None, cmap=None):
    """Wrapper around pl.imshow"""
    if cmap is None:
        cmap = cm.jet
    if vmin is None:
        vmin = data.min()
    if vmax is None:
        vmax = data.max()
    divider = make_axes_locatable(ax)
    cax = divider.append_axes("right", size="5%", pad=0.05)
    im = ax.imshow(data, vmin=vmin, vmax=vmax, interpolation='nearest', cmap=cmap)
    plt.colorbar(im, cax=cax)
    
################################################################

def get_activation(model, convout1, input_img):
    #K.learning_phase()
    inputs = [tf.constant(0, name='keras_learning_phase')] + model.inputs
    _convout1_f = K.function(inputs, [convout1.output])

    def convout1_f(X):
        # The [0] is to disable the training phase flag
        return _convout1_f([0] + [X])

    # Visualize convolution result (after activation)
    C1 = convout1_f(input_img)
    C1 = np.squeeze(C1)
    
    if (len(C1.shape) == 3):
        C1 = C1.reshape(C1.shape[0], 1, C1.shape[1], C1.shape[2])
    else:
        C1 = C1.reshape(C1.shape[0], 1, 1, 1)
        
    return C1.tolist()

def get_activation_sum(model, convout1, input_img):
    #K.learning_phase()
    inputs = [tf.constant(0, name='keras_learning_phase')] + model.inputs
    _convout1_f = K.function(inputs, [convout1.output])
    
    def convout1_f(X):
        # The [0] is to disable the training phase flag
        return _convout1_f([0] + [X])

    # Visualize convolution result (after activation)
    C1 = convout1_f(input_img)
    C1 = np.squeeze(C1)
    
    #print (len(C1.shape))
    if (len(C1.shape) == 3):
        C1 = C1.reshape(C1.shape[0], C1.shape[1] * C1.shape[2])
        C1 = np.sum(C1, axis=1)

    return C1.tolist()

def post_activation_to_server(model, convout_list, input_img):
    
    root='http://localhost:5000'
    path='/publish/epoch/end/'
    field='data'
    
    import requests
    send = {}
    send['type'] = 'model'

    send['weight'] = get_activation(model, convout_list[2], input_img)
        
    try:
        requests.post(root + path, {field: json.dumps(send)})
    except:
        print('Warning: could not reach RemoteMonitor '
              'root server at ' + str(root))
        
################################################################

class ModelRemote(callbacks.Callback):

    def __init__(self,
                 root='http://localhost:9000',
                 path='/publish/epoch/end/',
                 field='data',
                 old_weight=np.zeros(288), 
                 convout_list = None,
                 input_img = None):
        super(ModelRemote, self).__init__()
        self.root = root
        self.path = path
        self.field = field
        self.old_weight = old_weight
        self.convout_list = convout_list
        self.input_img = input_img
        
    def get_weight_changes(self, new_weight, num_layer):
        
        change = np.subtract(self.old_weight[num_layer], new_weight[num_layer])
        size = change.size
        change = np.absolute(change)
        change = np.sum(change)
        return float(change / size)
    
    def get_filter_changes(self, new_weight, num_layer):
        
        change = np.subtract(self.old_weight[num_layer], new_weight[num_layer])
        change = np.absolute(change)

        if (len(change.shape) == 4):
            change = change.reshape(change.shape[0], change.shape[1] * change.shape[2] * change.shape[3])
            change = np.sum(change, axis=1)
        else:
            change = np.sum(change, axis=0)
    
        return change.tolist()

    def on_epoch_begin(self, epoch, logs={}):
        
        #Calculate tsne val
        weight = self.model.get_weights()

        # 0, 2, 4, 6
        layer_weight = weight[0]
                         
        activation_sum_list = []
        filter_grad_list = []
        activation_list = []
        
        for i in range(len(self.convout_list)):
            # activation_sum
            ac_sum = get_activation_sum(self.model, self.convout_list[i], self.input_img)
            activation_sum_list.append(ac_sum)
            
            # filter_grad
            fg = self.get_filter_changes(weight, i * 2)
            filter_grad_list.append(fg)
            
            # activation
            act = get_activation(self.model, self.convout_list[i], self.input_img)
            activation_list.append(act)
            
        self.old_weight = weight

        import requests
        send = {}
        send['type'] = 'model'
        layer_weight = layer_weight.tolist()
        send['weight'] = layer_weight
        
        send['activation_sum'] = activation_sum_list
        send['filter_grad'] = filter_grad_list
        send['activation'] = activation_list


        try:
            requests.post(self.root + self.path,
                          {self.field: json.dumps(send)})
        except:
            print('Warning: could not reach RemoteMonitor '
                  'root server at ' + str(self.root))
            
            