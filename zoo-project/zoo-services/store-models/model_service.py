# -*- coding: utf-8 -*-
#
# Author : Gérald FENOY
#
# Copyright 2008-2013 GeoLabs SARL. All rights reserved.
#
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including with
# out limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject to
# the following conditions:
#
# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
# OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
# IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
# CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
# TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
#
import zoo,shutil,sys

def storeModel(conf,inputs,outputs):
	modelPath = conf["main"]["modelDir"]
	if inputs["type"]["value"] == "onnx":
		modelPath += "/onnx"
		extension = ".onnx" 
	# there 2 formats for tensoflow files: SavedModel (.zip) and HDF5 (.h5)
	if inputs["type"]["value"] == "tensorflow":
		# print("inputs: " + str(inputs),file=sys.stderr)
		modelPath += "/tensorflow"
		if inputs["model"]["type"] == "application/zip":
			extension = ".zip"
		if inputs["model"]["type"] == "application/x-hdf5":
			extension = ".h5"
	if inputs["type"]["value"] == "pytorch": #there is an open discussion about pytorch save format (.pth or .pt, etc). see https://github.com/pytorch/pytorch/issues/14864. for now we only take .zip
		modelPath += "/pytorch"
		if inputs["model"]["type"] == "application/zip":
			extension = ".zip"		
	if "cache_file" in inputs["model"]:
		tmp=inputs["model"]["xlink:href"].split("/")
		print("tmp: {0}, extension: {1}, conf[\"lenv\"][\"usid\"]: {2} ".format(tmp,extension,conf["lenv"]["usid"]),file=sys.stderr)
		shutil.move(inputs["model"]["cache_file"],modelPath+"/"+ tmp[len(tmp)-1].replace(extension, "_" + conf["lenv"]["usid"] + extension))
	outputs["Result"]["Value"] = zoo._("Model successfully stored")
	# [done] if the file already exists, make a new name
	# [done] develop further for tensorflow and pytorch 
	# [not needed] check if the chosen type and uploaded file format match. 
	# what if the file is too big and server times out uploading it?
	return zoo.SERVICE_SUCCEEDED

def list(conf,inputs,outputs):
	# make a list of models
	return zoo.SERVICE_SUCCEEDED
