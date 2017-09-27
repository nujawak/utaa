# coding: UTF-8

import os, urllib2, re, csv, sys, json, time, datetime
from bs4 import BeautifulSoup

class GetImage():
	"""docstring for temperature"""

	def __init__(self):
		self.songs = {}
		self.get_songs_list()
	
	def get_songs_list( self ):
		try:
			with open('../js/songs.json', 'r') as fileobj:
				self.songs = json.load(fileobj)
		except Exception as e:
			raise e
		finally:
			pass
	
	def save_image( self, discogsID ):
		'''
		request and save image
		'''
		slug      = discogsID.replace('r', 'release/').replace('m', 'master/')
		url       = 'https://www.discogs.com/' + slug
		save_path = '../img/%s.jpg' % (discogsID)
		UA        = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36'
		print 'request URL -> ' + url
		
		try:
			# get HTML
			request = urllib2.Request(url, headers ={'User-Agent': UA})
			page    = urllib2.urlopen(request)
			dom     = BeautifulSoup(page, 'lxml')
			img     = dom.find('span', {'class': 'thumbnail_center'}).find('img')
			attrs   = img.attrs
			print 'iamge URL   -> ' + attrs['src']
			
			with open(save_path, 'w') as fileobj:
				fileobj.write(urllib2.urlopen(attrs['src']).read())
		except Exception as e:
			raise e
		finally:
			return
	
	def get_all(self):
		'''
		main routine. get all images.
		'''
		for song in self.songs:
			print song['title']
			self.save_image( song['discogsID'] )
# end class

# 実行
app = GetImage()
app.get_all()
# app.save_image('m274260')