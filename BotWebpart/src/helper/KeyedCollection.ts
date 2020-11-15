// https://www.dustinhorne.com/post/2016/06/09/implementing-a-dictionary-in-typescript

export interface IKeyedCollection<T> {
    Add(key: string, value: T);
    Update(key: string, value: T);
    AddOrUpdate(key: string, value: T);
    ContainsKey(key: string): boolean;
    Count(): number;
    Item(key: string): T;
    Keys(): string[];
    Remove(key: string): T;
    Values(): T[];
    SerializeItemsAsJson(): string;
    RemoveAllItemsWithKeysStartingWith(keyPrefix: string): void;
}

export class KeyedCollection<T> implements IKeyedCollection<T> {
    private items: { [index: string]: T } = {};
 
    private count: number = 0;

    public RemoveAllItemsWithKeysStartingWith(keyPrefix: string): void {
        const keys: string[] = this.Keys();

        keys.forEach(k => {
            if (k.indexOf(keyPrefix) === 0)
                this.Remove(k);
        });
    }

    public SerializeItemsAsJson(): string {
        return JSON.stringify(this.items);
    }
 
    public ContainsKey(key: string): boolean {
        return this.items.hasOwnProperty(key);
    }
 
    public Count(): number {
        return this.count;
    }
 
    public Add(key: string, value: T) {
        if(!this.items.hasOwnProperty(key))
             this.count++;
 
        this.items[key] = value;
    }

    public Update(key: string, value: T) {
        this.items[key] = value;
    }

    public AddOrUpdate(key: string, value: T) {
        if (this.ContainsKey(key))
            this.Update(key, value);
        else
            this.Add(key, value);
    }
 
    public Remove(key: string): T {
        var val = this.items[key];
        delete this.items[key];
        this.count--;
        return val;
    }
 
    public Item(key: string): T {
        return this.items[key];
    }
 
    public Keys(): string[] {
        var keySet: string[] = [];
 
        for (var prop in this.items) {
            if (this.items.hasOwnProperty(prop)) {
                keySet.push(prop);
            }
        }
 
        return keySet;
    }
 
    public Values(): T[] {
        var values: T[] = [];
 
        for (var prop in this.items) {
            if (this.items.hasOwnProperty(prop)) {
                values.push(this.items[prop]);
            }
        }
 
        return values;
    }
}