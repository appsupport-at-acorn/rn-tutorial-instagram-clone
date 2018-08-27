/* @flow */

import firebase from 'firebase';
import React, { Component } from 'react';
import { LayoutAnimation, RefreshControl } from 'react-native';

import List from '../components/List';
import Fire from '../Fire';

// Set the default number of images to load for each pagination.
const PAGE_SIZE = 5;

type Props = { /* ... */ };

type State = {
  loading:boolean,
  posts:Array<Object>,
  data:Object,
};

type FirePost = {
  key:string,
  image:?string,
  imageHeight:number,
  imageWidth:number,
  name:string,
  text:string,
  timestamp:number,
  uid:string,
  user: Object,
};

export default class FeedScreen extends Component<Props, State> {
  state:State= {
    loading: false,
    posts: [],
    data: {},
  };

  lastKnownKey:string = '';

  constructor(props:any){
    super(props);

    this.state = {
      loading: false,
      posts: [],
      data: {},
    };
  }


  componentDidMount() {
    // Check if we are signed in...
    if (Fire.shared.uid) {
      // If we are, then we can get the first 5 posts
      this.makeRemoteRequest();
    } else {
      // If we aren't then we should just start observing changes. This will be called when the user signs in
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          this.makeRemoteRequest();
        }
      });
    }
  }

  // Append the item to our states `data` prop
  addPosts = (posts:Object) => {

    let getNewStateFn = (previousState:State, newPosts:Object):State => {

      // Create an object containing all of the posts, arranged by key.
      let data = {
        ...previousState.data,
        ...newPosts,
      };

      // Get as an array of objects instead.
      let dataAsArray:Array<FirePost> = (Object.values(data):any);

      // Compare two posts by timestamp
      let compareFn = (a:FirePost, b:FirePost):number => {
        return (b.timestamp - a.timestamp);
      }

      // sortedValues will hold an array of FirePost objects
      let sortedValues = dataAsArray.sort(compareFn);
      return {
        ...previousState,

        // Overwrite data
        data:data,

        // Overwrite posts with the sorted values.
        posts:sortedValues
      };
    }
    let newState = getNewStateFn(this.state, posts);

    this.setState(newState);
  };

  // Call our database and ask for a subset of the user posts
  makeRemoteRequest = async (lastKey:?string) => {
    // If we are currently getting posts, then bail out..
    if (this.state.loading) {
      return;
    }
    this.setState({ loading: true });

    // The data prop will be an array of posts, the cursor will be used for pagination.
    const { data, cursor } = await Fire.shared.getPaged({
      size: PAGE_SIZE,
      start: lastKey,
    });

    this.lastKnownKey = cursor;

    // Iteratively add posts
    let posts = {};
    for (let child of data) {
      posts[child.key] = child;
    }
    this.addPosts(posts);

    // Finish loading, this will stop the refreshing animation.
    this.setState({ loading: false });
  };

  // Because we want to get the most recent items, don't pass the cursor back.
  // This will make the data base pull the most recent items.
  _onRefresh = () => this.makeRemoteRequest();

  // If we press the "Load More..." footer then get the next page of posts
  onPressFooter = () => this.makeRemoteRequest(this.lastKnownKey);

  render() {
    // Let's make everything purrty by calling this method which animates layout changes.
    LayoutAnimation.easeInEaseOut();
    return (
      <List
        refreshControl={
          <RefreshControl
            refreshing={this.state.loading}
            onRefresh={this._onRefresh}
          />
        }
        onPressFooter={this.onPressFooter}
        data={this.state.posts}
      />
    );
  }
}
